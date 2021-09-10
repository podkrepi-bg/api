import { dbOrm } from './db-orm';

describe('dbOrm', () => {
  it('should work', () => {
    expect(dbOrm()).toEqual('db-orm');
  });
});
