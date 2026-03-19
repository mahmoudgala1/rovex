import fs from "fs";
import path from "path";
import { swaggerSpec } from "../swagger/swagger";

const outputPath = path.join(process.cwd(), "swagger.json");
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ Swagger JSON generated successfully at ${outputPath}`);
