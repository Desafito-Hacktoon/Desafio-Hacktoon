/// Configuração da API do backend
class ApiConfig {
  /// URL base da API
  /// Para emulador Android: use 10.0.2.2 ao invés de localhost
  /// Para dispositivo físico: use o IP da máquina na rede local
  /// Para iOS simulator: use localhost
  static const String baseUrl = 'http://10.0.2.2:8080/api';

  /// URL para iOS Simulator
  static const String baseUrlIOS = 'http://localhost:8080/api';

  /// URL para dispositivo físico (altere para o IP da sua máquina)
  static const String baseUrlDevice = 'http://192.168.1.100:8080/api';

  /// Timeout para requisições em segundos
  static const int connectionTimeout = 30;

  /// Timeout para leitura em segundos
  static const int receiveTimeout = 30;

  /// Endpoints da API de Ocorrências
  static const String ocorrenciasEndpoint = '/ocorrencias';
  static const String ocorrenciasProximasEndpoint = '/ocorrencias/proximas';
  static const String ocorrenciasCriticasEndpoint = '/ocorrencias/criticas';
}
