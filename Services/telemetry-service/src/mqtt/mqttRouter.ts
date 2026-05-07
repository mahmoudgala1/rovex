type Handler = (req: { params: Record<string, string> }, payload: any) => void;

class MqttRouter {
  private routes: { parts: string[]; handler: Handler }[] = [];

  topic(pattern: string, handler: Handler) {
    this.routes.push({ parts: pattern.split("/"), handler });
  }

  handle(topic: string, rawPayload: string) {
    const topicParts = topic.split("/");
    let payload: any;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      payload = rawPayload;
    }

    for (const route of this.routes) {
      if (route.parts.length !== topicParts.length) continue;

      const params: Record<string, string> = {};
      let matched = true;

      for (let i = 0; i < route.parts.length; i++) {
        const routePart = route.parts[i]!;
        const topicPart = topicParts[i]!;

        if (routePart === "+") continue;              
        if (routePart.startsWith(":")) {              
          params[routePart.substring(1)] = topicPart;
          continue;
        }
        if (routePart !== topicPart) { matched = false; break; }
      }

      if (matched) {
        route.handler({ params }, payload);
        return;
      }
    }
  }
}

export const mqttRouter = new MqttRouter();