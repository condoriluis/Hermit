import { createRoot } from 'react-dom/client'
import { VENTA } from '../../shared/venta'
import { App } from './App'
import { Recordatorio } from './Licencia'
import './tokens.css'
import './styles.css'

// La app que se vende recuerda, cada tantos inicios, que se puede apoyar a Hermit.
createRoot(document.getElementById('root')!).render(
  <>
    <App />
    {VENTA && <Recordatorio />}
  </>
)
