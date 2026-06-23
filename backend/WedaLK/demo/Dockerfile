# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Create uploads directory before switching to non-root user
RUN mkdir -p /app/uploads

# WSO2 Choreo Security Requirement: Run as a non-root user (UID 10000-20000)
RUN adduser -D -u 10014 choreouser && chown -R 10014:10014 /app/uploads
USER 10014

EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
