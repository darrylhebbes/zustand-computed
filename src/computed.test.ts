import { computed } from "./computed"
import create from "zustand"

type Store = {
  count: number
  x: number
  y: number
  inc: () => void
  dec: () => void
}

type ComputedStore = {
  countSq: number
  nestedResult: {
    stringified: string
  }
}

function computeState(state: Store): ComputedStore {
  const nestedResult = {
    stringified: JSON.stringify(state.count),
  }

  return {
    countSq: state.count ** 2,
    nestedResult,
  }
}

const computeStateMock = jest.fn(computeState)
const makeStore = () =>
  create<Store, [["chrisvander/zustand-computed", ComputedStore]]>(
    computed(
      (set) => ({
        count: 1,
        x: 1,
        y: 1,
        inc: () => set((state) => ({ count: state.count + 1 })),
        dec: () => set((state) => ({ count: state.count - 1 })),
      }),
      computeStateMock
    )
  )

let useStore: ReturnType<typeof makeStore>
beforeEach(() => {
  computeStateMock.mockClear()
  useStore = makeStore()
})

test("computed works on simple counter example", () => {
  // note: this function should have been called once on store creation
  expect(computeStateMock).toHaveBeenCalledTimes(1)
  expect(useStore.getState().count).toEqual(1)
  expect(useStore.getState().countSq).toEqual(1)
  useStore.getState().inc()
  expect(useStore.getState().count).toEqual(2)
  expect(useStore.getState().countSq).toEqual(4)
  useStore.getState().dec()
  expect(useStore.getState().count).toEqual(1)
  expect(useStore.getState().countSq).toEqual(1)
  useStore.setState({ count: 4 })
  expect(useStore.getState().countSq).toEqual(16)
  expect(computeStateMock).toHaveBeenCalledTimes(4)
})

test("computed does not modify object ref even after change", () => {
  useStore.setState({ count: 4 })
  expect(useStore.getState().count).toEqual(4)
  const obj = useStore.getState().nestedResult
  useStore.setState({ count: 4 })
  const toCompare = useStore.getState().nestedResult
  expect(obj).toEqual(toCompare)
})

test("modifying variables x and y do not trigger compute function, as they are never used", () => {
  expect(computeStateMock).toHaveBeenCalledTimes(1)
  useStore.setState({ x: 2 })
  expect(computeStateMock).toHaveBeenCalledTimes(1)
  useStore.setState({ y: 2 })
  expect(computeStateMock).toHaveBeenCalledTimes(1)
})
