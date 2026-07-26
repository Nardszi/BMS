const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany()
  .then(users => {
    console.log('Users found:', users.length);
    users.forEach(u => console.log('  ' + u.email + ' | ' + u.role));
    return p.$disconnect();
  })
  .catch(e => {
    console.error('Error:', e.message);
    return p.$disconnect();
  });
