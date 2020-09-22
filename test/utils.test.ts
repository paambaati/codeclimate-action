import test from 'tape';
import { areObjectsEqual } from '../src/utils';

test('🧪 areObjectsEqual() should correctly check object equality', (t) => {
  t.plan(1);
  const obj1 = {
    a: 1,
    b: true,
    c: null,
    d: undefined,
    45: -45.223232323,
  };
  t.true(
    areObjectsEqual(obj1, { ...obj1 }),
    'objects should be compared correctly.'
  );
  t.end();
});
