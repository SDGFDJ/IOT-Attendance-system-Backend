import bcryptjs from 'bcryptjs';

const password = "123456"; // जो password तुम रखना चाहते हो
const salt = await bcryptjs.genSalt(10);
const hashPassword = await bcryptjs.hash(password, salt);

console.log(hashPassword);