function sqrt(y) {
    if (y > 3) {
        z = y
        x = y / 2 + 1
        while (x < z) {
            z = x
            x = (y / x + x) / 2
        }
    } else if (y != 0) {
        z = 1
    }
    return z
}

module.exports = { sqrt }
