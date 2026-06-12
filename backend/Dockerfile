# ===== Stage 1: Build =====
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and pom first (for better layer caching)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

RUN chmod +x mvnw

# Download dependencies first (cached if pom.xml unchanged)
RUN ./mvnw dependency:go-offline -B --no-transfer-progress

# Copy source code (includes src/main/resources/static/ with all frontend files)
COPY src ./src

# Build the fat JAR — frontend assets are bundled inside
RUN ./mvnw clean package -DskipTests -B --no-transfer-progress

# ===== Stage 2: Run =====
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]