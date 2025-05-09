// import crypto module
import CryptoJS from "crypto-js";

// export encrypt function
export function encrypt(message: string, secret: string): string {
  // return encrypted message
  return CryptoJS.AES.encrypt(message, secret).toString();
}

// export decrypt function
export function decrypt(ciphertext: string, secret: string): string {
  // decrypt ciphertext
  const bytes = CryptoJS.AES.decrypt(ciphertext, secret);

  // return decrypted message
  return bytes.toString(CryptoJS.enc.Utf8);
}

// export generate random id
export function randomId(length = 5) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// export generate random key
export function randomKey() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  let result = [];

  // Ensure at least 3 numbers
  for (let i = 0; i < 3; i++) {
    result.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }

  // Fill the remaining characters with letters
  while (result.length < 7) {
    result.push(letters[Math.floor(Math.random() * letters.length)]);
  }

  // Shuffle the result array to mix numbers and letters
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  // return result
  return result.join('');
}

// import fs
import fs from "fs";

// get json stopwords
const stopwords = JSON.parse(fs.readFileSync("./db/stopwords.json", "utf8").trim());

// export decrypt function
export function properCase(text: string): string {
  const result = text.replace(/\w\S*/g, (txt: string) => {
    if (!stopwords.includes(txt.toLowerCase())) {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    } else {
      return txt.toLowerCase();
    }
  });

  return result.charAt(0).toUpperCase() + result.substring(1);
}

// export remove white space function
export function removeWhiteSpace(text: string): string {
  const result = text.replace(/\w\S*/g, (txt: string) => {
    if (!stopwords.includes(txt.toLowerCase())) {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    } else {
      return txt.toLowerCase();
    }
  });

  return result.charAt(0).toUpperCase() + result.substring(1);
}

// export create condition
export function createCondition(conditions: string[], query: any, struct: string | undefined) {
  // if struct is defined
  if (typeof struct !== "undefined") {
    // loop struct fields
    JSON.parse(struct).forEach((field: any) => {
      // if value not empty
      if (typeof query[field.name] !== "undefined") {
        // if type if defined
        if (typeof field.type !== "undefined") {
          // check field type
          if (field.type == "date") {
            // add field condition
            conditions.push(
              `(${field.name} BETWEEN '${query[field.name]} 00:00:00' AND '${query[field.name]} 23:59:59')`
            );
          } else if (field.type == "array" || field.type.startsWith("select")) {
            // add field condition
            conditions.push(`${field.name} = '${query[field.name]}'`);
          } else if (field.type == "number") {
            // add field condition
            conditions.push(`${field.name} = ${query[field.name]}`);
          } else {
            // add field condition
            conditions.push(`${field.name} LIKE '%${query[field.name]}%'`);
          }
        } else {
          // add field condition
          conditions.push(`${field.name} LIKE '%${query[field.name]}%'`);
        }
      }
    });
  }
}