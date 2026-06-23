# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

COPY ApiGateway.sln ./
COPY src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj src/Gateway.Middleware.Api/
COPY src/Gateway.Core/Gateway.Core.csproj src/Gateway.Core/
COPY src/Gateway.Data/Gateway.Data.csproj src/Gateway.Data/
COPY src/Gateway.Infrastructure/Gateway.Infrastructure.csproj src/Gateway.Infrastructure/

RUN dotnet restore src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj

COPY src/ src/

RUN dotnet publish src/Gateway.Middleware.Api/Gateway.Middleware.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Gateway.Middleware.Api.dll"]
