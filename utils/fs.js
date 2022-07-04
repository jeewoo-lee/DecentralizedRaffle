const fs = require("fs")

function readFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, "utf8")
        return data
    } catch (err) {
        console.error(err)
    }
}

function writeFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, data);
        console.log("Successful");
    } catch (err) {
        console.error(err)
    }
}

module.exports = { readFile, writeFile }
