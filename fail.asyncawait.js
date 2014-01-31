// this should fail cause it uses await outside of async function
async function() {
  await 10;
}

async function() {
  await 11;
}

async function name() {
  await 12;

  return async function() {
    await 13;
  }
}
