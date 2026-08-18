import {
  create,
  type StateCreator,
  type StoreApi,
  type UseBoundStore,
} from "zustand"

/** 项目级通用 store 工厂。业务状态和业务动作由调用方定义。 */
export const createAppStore = <T extends object>(
  initializer: StateCreator<T>,
): UseBoundStore<StoreApi<T>> => create<T>()(initializer);

export type AppStoreInitializer<T extends object> = StateCreator<T>;