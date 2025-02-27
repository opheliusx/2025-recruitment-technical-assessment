  const dashesBegone = /\-\_/
  const onlyAlpha = /a\ /
  const testString = 'aaa-_ p13'
  const newString = testString.replace(dashesBegone, ' ')
  console.log(newString)