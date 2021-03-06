# Ultimated
Start testing hybrid mobile apps on real devices within minutes!

**Ultimated** enables you to:
- [x] quickly set up testing environment
- [x] test your apps on real devices
- [x] execute tests on several devices at the same time
- [x] plug in more devices without additional configuration
- [x] write tests in edge Javascript (ES6, ES7)
- [x] focus on writing tests, instead of writing a framework
- [ ] ~~solve issues faster, thanks to the built-in error-solving systems~~

## Requirements
Supported machine systems:
- [x] Linux Ubuntu 14
- [x] Linux Ubuntu 16 (coming soon)
- [x] Linux Debian (coming soon)
- [ ] ~~macOS~~ (coming soon)
- [ ] ~~Windows~~ (coming after release 1.0.0)

Supported mobile device systems:
- [x] Android
- [ ] ~~iOS~~ (coming soon)


## Quick start
**How to install**
```
bash <( curl -s http://ultimatedtesting.com/install/ultimated )
```
**How to create a project**
```
ultimated create my_tests_project_name
```
**How to execute tests**
```
cd my_tests_project_name
ultimated
```

## Developing

**How to set up dev environment**

1. use the following command:

`cd ~/.ultimated/packages/ultimated-core && git clone https://github.com/ultimatedtesting/ultimated.git && rm -rf latest && ln -s ultimated latest && cd ultimated && ln -s ~/.ultimated/packages/node-suites/4/lib/node_modules node_modules`

2. edit the code located in ~/.ultimated/packages/ultimated-core/ultimated

## Uninstalling
```
rm -rf ~/.ultimated
```