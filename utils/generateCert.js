// utils/generateCert.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const execPromise = util.promisify(exec);

// Paths to CA files
const CA_CERT_PATH = path.join(__dirname, '../certs/ca.crt');
const CA_KEY_PATH = path.join(__dirname, '../certs/ca.key');
const CA_SERIAL_PATH = path.join(__dirname, '../certs/ca.srl');

// Function to generate and sign certificate
const generateAndSignCert = async (uuid) => {
  try {
    const certsDir = path.join(__dirname, '../certs');

    // Ensure certs directory exists
    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir);
    }

    // Paths for device cert files
    const deviceKeyPath = path.join(certsDir, `${uuid}.key`);
    const deviceCsrPath = path.join(certsDir, `${uuid}.csr`);
    const deviceCertPath = path.join(certsDir, `${uuid}.crt`);

    // 1. Generate Device Private Key
    const genKeyCmd = `openssl genrsa -out "${deviceKeyPath}" 2048`;
    await execPromise(genKeyCmd);
    console.log(`Generated private key for UUID: ${uuid}`);

    // 2. Create CSR
    const csrSubject = `/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=${uuid}`;
    const genCsrCmd = `openssl req -new -key "${deviceKeyPath}" -out "${deviceCsrPath}" -subj "${csrSubject}"`;
    await execPromise(genCsrCmd);
    console.log(`Generated CSR for UUID: ${uuid}`);

    // 3. Sign CSR with CA to generate Device Certificate
    const signCertCmd = `openssl x509 -req -in "${deviceCsrPath}" -CA "${CA_CERT_PATH}" -CAkey "${CA_KEY_PATH}" -CAcreateserial -out "${deviceCertPath}" -days 365 -sha256`;
    await execPromise(signCertCmd);
    console.log(`Signed certificate for UUID: ${uuid}`);

    // Optionally, delete the CSR
    fs.unlinkSync(deviceCsrPath);
    console.log(`Deleted CSR for UUID: ${uuid}`);

    // Read the signed certificate content
    const signedCert = fs.readFileSync(deviceCertPath, 'utf8');

    return {
      uuid,
      certPath: deviceCertPath,
      signedCert,
    };
  } catch (error) {
    console.error(`Error generating certificate for UUID: ${uuid}`, error);
    throw error;
  }
};

// Function to generate a new UUID and certificate
const createSignedCert = async () => {
  const uuid = uuidv4();
  const certData = await generateAndSignCert(uuid);
  return certData;
};

module.exports = { createSignedCert };