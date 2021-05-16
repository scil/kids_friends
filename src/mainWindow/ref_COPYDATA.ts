const FILENAME_MAX_LEN = 512;

const ref = require('ref-napi');
const Struct = require('ref-struct-di')(ref);
const ArrayType = require('ref-array-di')(ref);

const ULONG = ref.types.ulong;
const ULONG_P = ref.refType(ULONG);
// const CHAR_P = ref.refType(ref.types.char);
const CharArray = ArrayType('char *', FILENAME_MAX_LEN);
const CHARARRAY_P = ref.refType(CharArray);

const COPYDATA = new Struct({
  dwData: ULONG_P,
  cbData: ULONG,
  lpData: CHARARRAY_P,
});
// eslint-disable-next-line import/prefer-default-export
export const COPYDATA_P = ref.refType(COPYDATA);
