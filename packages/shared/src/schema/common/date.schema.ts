import z from 'zod'

/** ISO string on the wire, `Date` in code. DTOs using it need `createZodDto(schema, { codec: true })`. */
export const isoDateSchema = z.codec(z.iso.datetime(), z.date(), {
    decode: (isoString) => new Date(isoString),
    encode: (date) => date.toISOString(),
})
