# Weather API Response Example

The JSON file `json_original.json` is an example from the "bulk response" example found here (on 2025-11-23):
https://www.weatherapi.com/docs/

This serves as a good example of an array of nested JSON objects. This example has 3 objects in the array.

## What is in each file?

Note that when doing a roundtrip "parse" and "stringify" in JavaScript, numbers that end with a `.0` will be converted to integers. The `json_original.json` file has numbers that end with a `.0` and the other files do not.

The [OpenAI Tokenizer](https://platform.openai.com/tokenizer) was used to count the number of tokens that llms will see when using each file.

| File | Description | Number of tokens |
|------|-------------|-----------------|
| `json_original.json` | The original JSON file from the Weather API response | 1203 |
| `json_normalized.json` | The normalized JSON file with 2 spaces of indentation | 1155 |
| `json_compact.json` | All unnecessary whitespace removed | 776 |
| `tron_readable.tron` | The formatted TRON file with 2 spaces of indentation | 899 |
| `tron_compact.tron` | The formatted TRON file with all unnecessary whitespace removed | 592 |
| `tron_token_efficient.tron` | The formatted TRON file that balances readability and token efficiency | 595 |
