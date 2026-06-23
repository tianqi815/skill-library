# @tianqi815/skill-cli

Branded CLI for installing skills from [tianqi815/skill-library](https://github.com/tianqi815/skill-library).

## Usage

```bash
npx @tianqi815/skill-cli add code-review
npx @tianqi815/skill-cli add oidc-integration -g
npx @tianqi815/skill-cli list
npx @tianqi815/skill-cli search auth
```

## Publish to npm

From repository root:

```bash
npm publish --workspace @tianqi815/skill-cli --access public
```

Requires npm login with access to the `@tianqi815` scope.

## Implementation

Delegates installation to the community `skills` CLI:

```bash
npx skills add tianqi815/skill-library --skill <name> -a cursor -y
```
