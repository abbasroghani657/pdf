import translate from 'translate-google';

async function test() {
  console.log("Testing translate-google...");
  try {
    const res = await translate("Hello world", { to: 'hi' });
    console.log("Result:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
