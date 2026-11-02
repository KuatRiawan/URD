import { AppError } from '../utils/http.js';

// Joi menghasilkan pesan berbahasa Inggris (mis. "note length must be at least 10
// characters long"). Pesan itu tampil langsung ke pengguna di UI, sehingga harus
// menggunakan bahasa Indonesia agar staf operasional memahami cara memperbaikinya.
const JOI_MESSAGES = {
  'any.required': '{{#label}} wajib diisi.',
  'any.only': '{{#label}} harus bernilai salah satu dari {{#valids}}.',
  'any.invalid': '{{#label}} tidak valid.',
  'any.unknown': '{{#label}} tidak dikenali.',
  'string.empty': '{{#label}} tidak boleh kosong.',
  'string.base': '{{#label}} harus berupa teks.',
  'string.min': '{{#label}} minimal {{#limit}} karakter.',
  'string.max': '{{#label}} maksimal {{#limit}} karakter.',
  'string.length': '{{#label}} harus tepat {{#limit}} karakter.',
  'string.email': '{{#label}} harus berupa alamat email yang valid.',
  'string.pattern.base': '{{#label}} formatnya tidak sesuai.',
  'string.guid': '{{#label}} harus berupa ID yang valid.',
  'string.isoDate': '{{#label}} harus berupa tanggal yang valid.',
  'number.base': '{{#label}} harus berupa angka.',
  'number.integer': '{{#label}} harus berupa bilangan bulat.',
  'number.min': '{{#label}} minimal {{#limit}}.',
  'number.max': '{{#label}} maksimal {{#limit}}.',
  'number.greater': '{{#label}} harus lebih besar dari {{#limit}}.',
  'boolean.base': '{{#label}} harus bernilai benar atau salah.',
  'date.base': '{{#label}} harus berupa tanggal yang valid.',
  'date.iso': '{{#label}} harus menggunakan format tanggal ISO.',
  'date.greater': '{{#label}} harus setelah {{#limit}}.',
  'array.base': '{{#label}} harus berupa daftar.',
  'array.min': '{{#label}} minimal berisi {{#limit}} item.',
  'array.max': '{{#label}} maksimal berisi {{#limit}} item.',
  'array.unique': '{{#label}} tidak boleh berisi data ganda.',
  'object.base': '{{#label}} harus berupa objek.',
  'alternatives.match': '{{#label}} tidak sesuai dengan format yang diharapkan.'
};

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      messages: JOI_MESSAGES
    });
    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/["]/g, '')
      }));
      return next(new AppError(400, 'VALIDATION_ERROR', details[0].message, details));
    }
    req[source] = value;
    return next();
  };
}
