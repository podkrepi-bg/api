/** Create an object with methods that are autoSpy-ed to use as mock dependency */
export function autoSpy<T>(obj: new (...args: any[]) => T): SpyOf<T> {
  const res: SpyOf<T> = {} as any

  // turns out that in target:es2015 the methods attached to the prototype are not enumerable so Object.keys returns []. So to workaround that and keep some backwards compatibility - merge with ownPropertyNames - that disregards the enumerable property.
  // the Set remove duplicate entries
  const keys = new Set([
    ...(Object.keys(obj.prototype) as Array<keyof T>),
    ...(Object.getOwnPropertyNames(obj.prototype) as Array<keyof T>),
  ])

  keys.forEach((key) => {
    if (typeof key === 'string') {
      ;(res[key] as any) = jest.fn()
    }
  })

  return res
}

/**
 * Keeps the types of properties of a type but assigns type of jest.Mock to the methods.
 * That way the methods can be mocked and examined for calls.
 *
 * @example
 *
 * class Service {
 *  property: string;
 *  method(): string {
 *    return 'test'
 *  };
 * }
 *
 * it('should carry the types (only methods should be mocked)', () => {
 *  // arrange
 *  const ser = autoSpy(Service);
 *  // this line would show a typescript error were it not for the type- can't assign string to jest.Mock type
 *  ser.property = 'for the test';
 *  ser.method.mockReturnValue('test');
 *
 *  // act
 *  const res = ser.method();
 *
 *  // assert
 *  expect(ser.method).toHaveBeenCalled();
 *  expect(res).toBe('test');
 * })
 *
 */
export type SpyOf<T> = T & {
  [k in keyof T]: T[k] extends (...args: any[]) => infer R ? T[k] & jest.Mock<R> : T[k]
}
