import { describe, expect, it } from "vitest";

import { EXPLORE_TOPICS, EXPLORE_TOPIC_PATHS, getExploreTopic } from "./explore-topics";
import { PUBLIC_PATHS } from "./seo-route-policy";
import { LAYERS } from "./world-data";

describe("global explore topic landing pages", () => {
  it("covers every canonical map layer exactly once", () => {
    expect(EXPLORE_TOPICS.map((topic) => topic.layer).sort()).toEqual(
      LAYERS.map((layer) => layer.id).sort(),
    );
  });

  it("has unique slugs and one indexable route per topic", () => {
    expect(new Set(EXPLORE_TOPICS.map((topic) => topic.slug)).size).toBe(EXPLORE_TOPICS.length);
    expect(new Set(EXPLORE_TOPIC_PATHS).size).toBe(EXPLORE_TOPIC_PATHS.length);
    for (const path of EXPLORE_TOPIC_PATHS) expect(PUBLIC_PATHS).toContain(path);
  });

  it("provides useful topic-specific copy without asserting local stock", () => {
    for (const topic of EXPLORE_TOPICS) {
      expect(topic.heading.trim().length).toBeGreaterThan(12);
      expect(topic.description.trim().length).toBeGreaterThan(40);
      expect(topic.introduction.trim().length).toBeGreaterThan(40);
      expect(topic.goodFor).toHaveLength(3);
      expect(topic.nextStep.trim().length).toBeGreaterThan(30);
      expect(getExploreTopic(topic.slug)).toEqual(topic);
    }
    expect(getExploreTopic("not-a-topic")).toBeUndefined();
  });
});
