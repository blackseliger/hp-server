const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const koaStatic = require('koa-static');


const app = new Koa();
const public = path.join(__dirname, '/public')
app.use(koaStatic('public'));


let tickets = [
      { id: '1', name: 'Buy a bread', description: 'brown bread', created: new Date() },
      { id: '2', name: 'Buy a milk', description: '2l', created: new Date() },
      { id: '3', name: 'Buy a fish', description: 'tuna', created: new Date() },
      { id: '4', name: 'Buy a car', description: 'something red', created: new Date() }
]

// ctx - объект
// ctx.request - запрос
// ctx.responce - ответ
app.use(koaBody({
    urlencoded: true,
  }));
  
  // Preflight
  app.use(async (ctx, next) => {
    const headers = { "Access-Control-Allow-Origin": "*" };
    ctx.response.set({ ...headers });
  
    const origin = ctx.request.get("Origin");
    if (!origin) {
      return await next();
    }
    
    if (ctx.request.method !== "OPTIONS") {
      try {
        return await next();
      } catch (e) {
        e.headers = { ...e.headers, ...headers };
        throw e;
      }
    }
    if (ctx.request.get("Access-Control-Request-Method")) {
      ctx.response.set({
        ...headers,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
      });
      if (ctx.request.get("Access-Control-Request-Headers")) {
        ctx.response.set(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        );
      }
      ctx.response.status = 204;
    }
  });
// GET /tickets
app.use(async (ctx, next) => {
  if (ctx.request.method === "GET") {
    if (ctx.request.url.startsWith('/tickets')) {
      if (ctx.request.query.id) {
        const ticket = tickets.find((element) => element.id === ctx.request.query.id);
        if (ticket === undefined) {
          ctx.response.status = 404;
          ctx.response.body = 'Ticket not found';
          return await next();
        }

        ctx.response.status = 200;
        ctx.response.body = ticket;
        return await next();
      }

      ctx.response.status = 200;
      
      ctx.response.body = tickets;
      // ctx.response.body = Array.from(tickets).map((o) => ({
      //   id: o.id,
      //   name: o.name,
      //   status: o.status,
      //   created: o.created 
      // }));
      return await next();
    }
  }
  return await next();
});

// POST /tickets
app.use(async (ctx, next) => {
  if (ctx.request.method === "POST") {
    if (!ctx.request.url.startsWith('/tickets')) {
      ctx.response.status = 417;
      ctx.response.body = '"/tickets" expected';
      return await next();
    }

    if (!ctx.is( 'application/json')) {
      ctx.response.status = 417;
      ctx.response.body = '"application/json" expected';
      return await next();
    }

    const ticket = ctx.request.body;
    if (!ticket) {
      ctx.response.status = 417;
      ctx.response.body = 'object ticket expected';
      return await next();
    }
    
    ticket.id = uuid.v4();
    ticket.created = new Date();
    tickets.push(ticket);

    ctx.response.status = 200;
    ctx.response.body = ticket;
  }
  return await next();
});

// PUT /tickets
app.use(async (ctx, next) => {
  if (ctx.request.method === "PUT") {
    if (!ctx.request.url.startsWith('/tickets')) {
      ctx.response.status = 417;
      ctx.response.body = '"/tickets" expected';
      return await next();
    }

    const ticket = ctx.request.body;

    if (!ticket) {
      ctx.response.status = 417;
      ctx.response.body = 'object expected';
      return await next();
    }
    
    const editTicket = tickets.find((el) => el.id === ctx.request.query.id);
    console.log(editTicket);
    if (editTicket === undefined) {
      ctx.response.status = 404;
      ctx.response.body = 'Ticket not found';
      return await next();
    }

    editTicket.name = ticket.name;
    editTicket.description = ticket.description; 
    editTicket.created = new Date();

    ctx.response.status = 200;
    ctx.response.body = editTicket;
  }
  return await next();
});



// DELETE /tickets
app.use(async (ctx, next) => {
  if (ctx.request.method === "DELETE") {
    if (!ctx.request.url.startsWith('/tickets')) {
      ctx.response.status = 417;
      ctx.response.body = '"/tickets" expected';
      return await next();
    }

    tickets = tickets.filter((ticket) => ticket.id !== ctx.request.query.id)

    if (!tickets.length) {
      ctx.response.status = 404;
      ctx.response.body = 'Ticket not found';
      return await next();
    }

    ctx.response.status = 200;
    ctx.response.body = tickets;
  }
  return await next();
});

  const port = process.env.PORT || 7070;
  const server = http.createServer(app.callback()).listen(port);
  console.log(`Server is listening on port ${port}`);