import test from "./helpers/avaEx"
import { GitHubPublisher } from "out/publish/gitHubPublisher"
import { HttpError } from "out/publish/gitHubRequest"
import { join } from "path"
import * as assertThat from "should/as-function"

//noinspection JSUnusedLocalSymbols
const __awaiter = require("out/util/awaiter")

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function versionNumber() {
  return getRandomInt(0, 99) + "." + Date.now() + "." + getRandomInt(0, 9)
}

const token = new Buffer("Y2Y5NDdhZDJhYzJlMzg1OGNiNzQzYzcwOWZhNGI0OTk2NWQ4ZDg3Yg==", "base64").toString()
const iconPath = join(__dirname, "..", "fixtures", "test-app", "build", "icon.icns")

//test("GitHub unauthorized", async (t) => {
//  t.throws(await new GitHubPublisher("github-releases-test", "test-repo", versionNumber(), "incorrect token")
//    .releasePromise, /(Bad credentials|Unauthorized|API rate limit exceeded)/)
//})

function isApiRateError(e: Error): boolean {
  if (e instanceof HttpError) {
    return e.description != null && e instanceof HttpError && e.description.message != null && e.description.message.includes("API rate limit exceeded")
  }
  else {
    return false
  }
}

function testAndIgnoreApiRate(name: string, testFunction: () => Promise<any>) {
  test(name, async () => {
    try {
      await testFunction()
    }
    catch (e) {
      if (isApiRateError(e)) {
        console.warn(e.description.message)
      }
      else {
        throw e
      }
    }
  })
}

// testAndIgnoreApiRate("Bintray upload", async () => {
//   const publisher = new BintrayPublisher("actperepo", "5df2cadec86dff91392e4c419540785813c3db15", versionNumber(), "test")
//   try {
//     await publisher.upload(iconPath)
//   }
//   finally {
//     // await publisher.deleteRelease()
//   }
// })

testAndIgnoreApiRate("GitHub upload", async () => {
  const publisher = new GitHubPublisher("actperepo", "ecb2", versionNumber(), {
    githubToken: token
  })
  try {
    await publisher.upload(iconPath)
  }
  finally {
    await publisher.deleteRelease()
  }
})

testAndIgnoreApiRate("prerelease", async () => {
  const publisher = new GitHubPublisher("actperepo", "ecb2", versionNumber(), {
    githubToken: token,
    draft: false,
    prerelease: true,
  })
  try {
    await publisher.upload(iconPath)
    const r = await publisher.getRelease()
    assertThat(r).has.properties({
      prerelease: true,
      draft: false,
    })
  }
  finally {
    await publisher.deleteRelease()
  }
})

testAndIgnoreApiRate("incorrect tag name", async () => {
  const publisher = new GitHubPublisher("actperepo", "ecb2", "5.0", {
    githubToken: token,
    draft: false,
    prerelease: true,
    publish: "onTagOrDraft",
  })
  try {
    await publisher.releasePromise
    //noinspection ExceptionCaughtLocallyJS
    throw new Error("No expected error")
  }
  catch (e) {
    if (e.message !== 'Tag name must starts with "v": 5.0') {
      throw e
    }
  }
  finally {
    await publisher.deleteRelease()
  }
})

testAndIgnoreApiRate("GitHub upload org", async () => {
  //noinspection SpellCheckingInspection
  const publisher = new GitHubPublisher("builder-gh-test", "darpa", versionNumber(), {
      githubToken: token
    })
  try {
    await publisher.upload(iconPath)
  }
  finally {
    await publisher.deleteRelease()
  }
})

testAndIgnoreApiRate("GitHub overwrite on upload", async () => {
  const publisher = new GitHubPublisher("actperepo", "ecb2", versionNumber(), {
      githubToken: token
    })
  try {
    await publisher.upload(iconPath)
    await publisher.upload(iconPath)
  }
  finally {
    await publisher.deleteRelease()
  }
})
