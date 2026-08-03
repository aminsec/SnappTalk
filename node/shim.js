// shim.ts
import v8 from "node:v8";
if (typeof v8.isBuildingSnapshot !== "function" || true) {
  // @ts-ignore
  v8.isBuildingSnapshot = () => false;
}