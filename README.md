# @zppack/zp-vars

A middleware for zp to support interactive Q&A and do replacement to template files.

Also provide a cli tool for test or development.

## Start

### Config

- middleware name: **@zppack/zp-vars**
- config file: **`.zp/.zp-vars.toml`**, TOML v1.0.
- config format: a list named `zpvars`, to configure inquirer questions `name` or more fields. If only `name` field, can be shorted as a string.

### Config Examples

```toml
# TOML v1.0
# Variables will ask to input

zpvars = [
  'name', # same as { name = 'name' }, or { name = 'name', message = 'Input name: ' },
  'description',
  'author',
  { name = 'remote', message = 'Git remote url: ' },
  'homepage',
  { name = 'license', default = 'MIT' },
]

# replaceName = false # do not replace file or directory name by default
```

```toml
# TOML v1.0

replaceName = true

[[zpvars]]
name = 'name'

[[zpvars]]
name = 'remote'
message = 'Git remote url: '

[[zpvars]]
name = 'license'
default = 'MIT'
```

### CLI

```sh
npx @zppack/zp-vars [path]
```

## Contributing

[How to contribute to this?](CONTRIBUTING.md)

## Recently changes

See the [change log](CHANGELOG.md).

## License

[MIT](LICENSE)
