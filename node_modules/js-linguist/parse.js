function trimLinguistOutput (data) {
  const obj = {}
  var percentage, lang

  data = data.split('\n')
  for (var line in data) {
    line = data[line].split(' ')
    line = line.filter(v => v !== '')
    if (line.length > 0) {
      lang = line.slice(1).join(' ')
      percentage = line[0].split('%')[0]
      obj[lang] = percentage
    }
  }
  return obj
}

module.exports = {
  trimLinguistOutput: trimLinguistOutput
}
