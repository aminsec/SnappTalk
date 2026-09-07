// shim.js
const originalGetBuiltinModule = process.getBuiltinModule?.bind(process);

if (originalGetBuiltinModule) {
  process.getBuiltinModule = (id) => {
    const mod = originalGetBuiltinModule(id);
    if (id === "v8" && mod) {
      return new Proxy(mod, {
        get(target, prop, receiver) {
          if (prop === "startupSnapshot") {
            return {
              isBuildingSnapshot: () => false,
              addSerializeCallback: () => {},
              addDeserializeCallback: () => {},
              setDeserializeMainFunction: () => {},
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }
    return mod;
  };
}