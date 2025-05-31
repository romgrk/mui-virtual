#!/usr/bin/env zx

$.verbose = true

// Build packages

await $`cd ~/src/mui-x && pnpm run release:build`


// Copy here

const packages =
  fs.readdirSync('/home/romgrk/src/mui-x/packages')
    .filter(name => name.startsWith('x-') && !name.includes('charts'))

console.log(packages)

await $`mkdir -p ./node_modules/@mui`

for (const name of packages) {
  const sourcePath = `/home/romgrk/src/mui-x/packages/${name}`
  const data = JSON.parse(fs.readFileSync(`${sourcePath}/package.json`))
  const packageName = data.name

  const targetPath = `./node_modules/${packageName}`

  await $`rm -rf ${targetPath}`
  await $`cp -r ${sourcePath}/build ${targetPath}`
}


// Build

await $`pnpm run build`
