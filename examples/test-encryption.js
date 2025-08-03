require("module-alias/register");
require("dotenv").config();
const { encrypt, decrypt } = require("@helpers/encryption");

function testEncryption() {
  try {
    console.log("Testing encryption...");
    console.log("Using ENCRYPTION_KEY:", process.env.ENCRYPTION_KEY);

    const originalText = "user@example.com";
    console.log("Original text:", originalText);

    const encrypted = encrypt(originalText);
    console.log("Encrypted:", encrypted);

    const decrypted = decrypt(encrypted);
    console.log("Decrypted:", decrypted);

    if (decrypted === originalText) {
      console.log("✅ Test passed successfully!");
    } else {
      console.log("❌ Test failed: Decrypted text doesn't match original");
    }
  } catch (error) {
    console.error("❌ Encryption test failed:", error.message);
    process.exit(1);
  }
}

testEncryption();
