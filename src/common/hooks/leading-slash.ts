import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export function leadingSlashHook(
  req: FastifyRequest,
  rep: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  const url = req.url;
  const endpoint = url.split("?")[0].split("#")[0];

  if (endpoint.length > 1 && endpoint.endsWith("/")) {
    const newUrl = url.slice(0, -1);
    rep.redirect(newUrl, 301);
  } else {
    done();
  }
}
