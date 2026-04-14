type Handler = (req: any, payload: any) => void;

class MqttRouter {
  private routes: { pattern: string; parts: string[]; handler: Handler }[] = [];

  topic(pattern: string, handler: Handler) {
    this.routes.push({
      pattern,
      parts: pattern.split("/"),
      handler,
    });
  }

  handle(topic: string, payload: string) {
    const topicParts = topic.split("/");

    for (const route of this.routes) {
      if (route.parts.length !== topicParts.length) continue;

      let params: any = {};
      let matched = true;

      for (let i = 0; i < route.parts.length; i++) {
        const routePart = route.parts[i]!;
        const topicPart = topicParts[i];

        if (routePart.startsWith(":")) {
          const key = routePart.substring(1);
          params[key] = topicPart;
          continue;
        }

        if (routePart !== topicPart) {
          matched = false;
          break;
        }
      }

      if (matched) {
        route.handler(
          {
            topic,
            params,
          },
          JSON.parse(payload)
        );
        return;
      }
    }
  }
}

export const mqttRouter = new MqttRouter();
