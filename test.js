const b = {
  pickupDate: "15 Sep",
  returnDate: "20 Sep",
  status: "CONFIRMED"
};

const parseDate = (dateStr) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = dateStr.split(' ');
  if (parts.length >= 2 && months.includes(parts[1])) {
    const day = parseInt(parts[0], 10);
    const month = months.indexOf(parts[1]);
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date(`${dateStr} ${new Date().getFullYear()}`);
  return d;
};

const pickup = parseDate(b.pickupDate);
const returnDt = parseDate(b.returnDate);
returnDt.setHours(23, 59, 59, 999);

const isOngoingInferred = !isNaN(pickup.getTime()) && !isNaN(returnDt.getTime()) 
  && b.status === 'CONFIRMED' 
  && pickup <= new Date() 
  && returnDt >= new Date();

console.log("pickup:", pickup);
console.log("returnDt:", returnDt);
console.log("now:", new Date());
console.log("pickup <= now:", pickup <= new Date());
console.log("returnDt >= now:", returnDt >= new Date());
console.log("isOngoingInferred:", isOngoingInferred);
