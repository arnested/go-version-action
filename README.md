# Go version action

> Provide go versions for use in your workflow

## Inputs

```yaml
  working-directory:
    description: Working direcory where you go.mod file is located
    required: false
    default: .
```

## Outputs

```yaml
  latest:
    description: The latest go version
  minimal:
    description: The minial go version (as specified by go.mod)
  matrix:
    description: An array of go versions from the minimum supported version to the latest released version
  module:
    description: The go module name (as specified by go.mod)
```
