import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

async function bootstrap() {
  const keyPath = path.join(process.cwd(), "server-key.pem");
  const certPath = path.join(process.cwd(), "server-cert.pem");

  let httpsOptions;
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  const app = await NestFactory.create(
    AppModule,
    httpsOptions ? { httpsOptions } : undefined
  );

  app.enableCors({});

  // Enable global validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  await app.listen(3030);
}
bootstrap();
