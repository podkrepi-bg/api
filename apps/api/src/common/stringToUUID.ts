import { v5 as uuidv5 } from 'uuid'
export function stringToUUID(str: string) {
  const OIS_NAMESPACE = '6ba7b812-9dad-11d1-80b4-00c04fd430c8'
  return uuidv5(str, OIS_NAMESPACE)
}
