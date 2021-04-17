# Contributing to Vorta

First and foremost, thanks! This project is something very near and dear to me, and you seeing value in it too is really cool. Let's talk about how we work!

## Tech Choices

There are always a lot of choices when it comes to a JS project. This is a node library, and is designed with that in mind. For development we use:

  * TypeScript
  * Babel
  * nodemon

## Local Development

When you use `yarn run b` or `yarn run bb` or `yarn run bbb` you're using `babel-node` to load our typescript dynamically. Each `b` adds a level of inspecting:

  * `b` => no inspector
  * `bb` => --inspect
  * `bbb` => --inspect-brk

This makes debugging simpler because you can change the `level` of debugging easily.

### nodemon

We've built in a general helper:

```sh
$ yarn dev:brk .\lib\index.ts flow quality
$ nodemon -e ts --exec yarn bbb .\lib\index.ts flow quality
[nodemon] 2.0.7
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts
[nodemon] starting `yarn bbb .\lib\index.ts flow quality`
$ babel-node --inspect-brk --extensions ".js,.ts" .\lib\index.ts flow quality
Debugger listening on ws://127.0.0.1:9229/a1c427e8-89c7-45d3-9160-2946d35344a7
For help, see: https://nodejs.org/en/docs/inspector
```

Using `yarn run dev:brk` starts your inspector, which can be connected to from chrome/chromium/edge from `about://inspect` or `edge://inspect` and clicking `open dedicated devtools for node`.

The command `$ nodemon -e ts --exec yarn bbb .\lib\index.ts flow quality` is just launching our `vorta` cli, but in context and typescript, instead of how it's deployed. Deployed use is done after it's been transpiled, so having a local helper for using the TS directly makes development far simpler. As you change files, nodemon will restart the whole process, allowing you to place debuggers and make incremental changes!

## Commit Sanity

For every commit we run a series of helpers:

  * husky
  * commitlint
  * eslint
  * prettier
  * jest
  * ourself (vorta)

The current flow works like this:

  1. write some code
  1. create a commit
  1. before the commit, husky will run prettier on code and add it to your commit
  1. push commit to the remote, open PR
  1. launch github actions
  1. run the `quality` vorta flow via `yarn cli flow quality`
  1. test the commit message via `commitlint`

If all of these steps pass you'll get a green checkmark and be ready to go.

### commitlint

We are expecting a very particular commit format. If it's foreign to you try:

```sh
$ yarn commit
$ git-cz
cz-cli@4.2.2, cz-conventional-changelog@3.3.0

? Select the type of change that you're committing: (Use arrow keys)
> feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
  test:     Adding missing tests or correcting existing tests
```

It will guide you through creating a proper commit.

## Releases

This is fully automated, using `semantic-release` in conjunction with the `commitlint` steps above. When code is merged to main we will:

  * create a changelog
  * bump package version
  * create a release tag
  * push all to main

This means any commit that is merged will auto version and release, no manual steps!
