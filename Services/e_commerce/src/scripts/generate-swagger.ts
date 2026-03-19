import fs from "fs";
import path from "path";
import { swaggerSpec } from "../swagger/swagger";
import swaggerJsdoc from "swagger-jsdoc";
const specs = swaggerJsdoc(swaggerSpec);

const outputPath = path.join(process.cwd(), "swagger.json");
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log(`✅ Swagger JSON generated successfully at ${outputPath}`);
