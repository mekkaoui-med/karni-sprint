const nameRegex = /^[\p{L} -']{2,40}$/u;
const phoneRegex = /^[0-9]{10}$/

export function validateName(name) {
  if (nameRegex.test(name)) {
    return { status: "valid" };
  } else return { status: "invalid" };
}

export function validatePhone(phone)
{
    
}