"""
El candado de un render: un solo render por carpeta de episodio a la vez.

    python -I -B -X utf8 <video-base>/scripts/candado.py tomar <carpeta-del-episodio>
    python -I -B -X utf8 <video-base>/scripts/candado.py soltar <carpeta-del-episodio>

O desde otro script de la skill: `import candado` y `candado.tomar(carpeta)` / `candado.soltar(carpeta)`.

`tomar` crea `out/.render.lock` con el pid y la hora de este proceso, de forma atómica
(`O_CREAT|O_EXCL`): dos renders que arranquen a la vez no pueden tomarlo los dos. Si ya hay
un candado cuyo proceso sigue vivo y no tiene más de MAX_HORAS, sale con error claro: otro
render está en curso en esa carpeta y dos a la vez se pisarían el `final.mp4` (o gastarían
el doble de recursos). Si el proceso ya no existe —un render cortado— el candado se
reemplaza solo, así que un bloqueo nunca es permanente; y `soltar` lo quita solo si es de
este proceso: jamás borra el de otro render vivo.

Funciona igual en Windows, Linux y macOS: el pid se comprueba con la API de cada sistema
(`OpenProcess` en Windows, `kill(pid, 0)` en Unix), sin dependencias.
"""

import json
import os
import sys
import time
from pathlib import Path

# Un render puede tardar una hora larga; pasadas estas horas el pid pudo reciclarse y el
# candado se da por muerto aunque el número siga vivo.
MAX_HORAS = 12


def _lock(carpeta: Path) -> Path:
    return Path(carpeta) / "out" / ".render.lock"


def _vivo(pid: int) -> bool:
    """Si el proceso existe. En Windows, `os.kill(pid, 0)` terminaría el proceso: no se usa."""
    if pid <= 0:
        return False
    if os.name == "nt":
        import ctypes
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        # PROCESS_QUERY_LIMITED_INFORMATION: abrir un proceso solo para saber si vive.
        h = kernel.OpenProcess(0x1000, False, pid)
        if h:
            kernel.CloseHandle(h)
            return True
        return ctypes.get_last_error() == 5  # ERROR_ACCESS_DENIED: existe, pero no se puede abrir
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    except OSError:
        return False
    return True


def _leer(lock: Path) -> dict:
    try:
        return json.loads(lock.read_text(encoding="utf-8"))
    except Exception:
        return {}


def tomar(carpeta) -> None:
    """Toma el candado del episodio. Si otro render vivo lo tiene, SystemExit con el motivo."""
    raiz = Path(carpeta)
    (raiz / "out").mkdir(exist_ok=True)
    lock = _lock(raiz)
    datos = {"pid": os.getpid(), "ts": time.time(), "comando": " ".join(sys.argv)}
    # O_EXCL es la creación atómica: si el archivo existe, FileExistsError y se decide qué toca.
    # Si el candado es de un proceso muerto se borra y se reintenta; si dos renders lo encuentran
    # muerto a la vez, solo uno gana la segunda creación y el otro ve el candado nuevo y vivo.
    for _ in range(20):
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            d = _leer(lock)
            if not d:
                # Recién creado y aún sin escribir: es de otro render que está tomándolo ahora.
                # Esperar un momento en vez de borrarlo (borrarlo dejaría pasar a los dos).
                try:
                    if time.time() - lock.stat().st_mtime < 10:
                        time.sleep(0.2)
                        continue
                except OSError:
                    continue
            pid, ts = int(d.get("pid") or 0), float(d.get("ts") or 0)
            if _vivo(pid) and time.time() - ts < MAX_HORAS * 3600:
                mins = int((time.time() - ts) / 60)
                raise SystemExit(f"candado: ya hay un render en curso en esta carpeta (proceso {pid}, "
                                 f"desde hace {mins} min). Espera a que termine o detén ese proceso; "
                                 "dos renders a la vez se pisan el video final.")
            try:
                lock.unlink()
            except FileNotFoundError:
                pass
            continue
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(datos, f)
        return
    raise SystemExit("candado: no se pudo tomar el candado (demasiados intentos).")


def soltar(carpeta) -> None:
    """Suelta el candado, solo si es de este proceso. Nunca falla: el candado se sana solo."""
    try:
        lock = _lock(Path(carpeta))
        if int(_leer(lock).get("pid") or -1) == os.getpid():
            lock.unlink(missing_ok=True)
    except Exception:
        pass


def main() -> None:
    if len(sys.argv) != 3 or sys.argv[1] not in ("tomar", "soltar"):
        sys.exit(__doc__)
    (tomar if sys.argv[1] == "tomar" else soltar)(sys.argv[2])


if __name__ == "__main__":
    main()
