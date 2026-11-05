fn main() {
  // En Windows los símbolos de N-API se resuelven en tiempo de carga (napi-sys usa
  // libloading sobre el propio proceso): no hacen falta node.lib ni una librería de
  // importación. En Mac y Linux napi-build pone los enlaces que sí hacen falta.
  if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") {
    napi_build::setup();
  }
}
