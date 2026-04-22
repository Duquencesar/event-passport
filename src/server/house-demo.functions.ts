import { createServerFn } from "@tanstack/react-start";
import { prepareHouseDemo } from "@/server/house.server";

export const prepareHouseDemoAction = createServerFn({ method: "POST" }).handler(async () => {
  return prepareHouseDemo();
});
