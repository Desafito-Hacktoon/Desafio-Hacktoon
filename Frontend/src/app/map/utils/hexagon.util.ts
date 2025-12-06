/**
 * Utilitário para geração de grade hexagonal perfeita no mapa
 * Tesselação contínua sem gaps ou sobreposições - similar ao Uber/99
 */

export interface Hexagon {
  id: string;
  center: [number, number]; // [latitude, longitude]
  coordinates: [number, number][]; // Array de coordenadas do hexágono
  occurrenceCount: number;
  intensity: number; // 0-1 para intensidade de cor
}

export interface HexagonGridOptions {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  hexSize: number; // Tamanho do hexágono em metros
}

export interface FixedHexagonGridConfig {
  origin: [number, number]; // Ponto de origem fixo [lat, lng]
  hexSize: number; // Tamanho do hexágono em metros (fixo)
}

/**
 * Utilitário para geração de grade hexagonal perfeita
 */
export class HexagonUtil {
  // Configuração da grade fixa global
  private static fixedGridConfig: FixedHexagonGridConfig = {
    origin: [-26.9180776, -49.0745391], // Ponto de origem fixo
    hexSize: 1000 // 1 km de raio (área de ~2.6 km²)
  };

  /**
   * Converte coordenadas hexagonais (q, r) para um ID único
   */
  static getHexagonId(q: number, r: number): string {
    return `hex_${q}_${r}`;
  }

  /**
   * Converte coordenadas hexagonais (q, r) para latitude/longitude fixa
   */
  static hexToLatLng(q: number, r: number): [number, number] {
    const { origin, hexSize } = this.fixedGridConfig;
    const centerLat = origin[0];
    
    const hexRadiusMeters = hexSize;
    const hexRadiusLat = this.metersToLatDegrees(hexRadiusMeters);
    const hexRadiusLng = this.metersToLngDegrees(hexRadiusMeters, centerLat);
    
    // Para tesselação perfeita (pointy-top)
    const horizontalSpacing = Math.sqrt(3) * hexRadiusLng;
    const verticalSpacing = 1.5 * hexRadiusLat;
    const horizontalOffset = horizontalSpacing / 2;
    
    // Calcula a posição absoluta do hexágono
    const offsetX = (r % 2) * horizontalOffset;
    const lat = origin[0] - (r * verticalSpacing);
    const lng = origin[1] + (q * horizontalSpacing) + offsetX;
    
    return [lat, lng];
  }

  /**
   * Converte latitude/longitude para coordenadas hexagonais (q, r)
   */
  static latLngToHex(lat: number, lng: number): { q: number; r: number } {
    const { origin, hexSize } = this.fixedGridConfig;
    const centerLat = origin[0];
    
    const hexRadiusMeters = hexSize;
    const hexRadiusLat = this.metersToLatDegrees(hexRadiusMeters);
    const hexRadiusLng = this.metersToLngDegrees(hexRadiusMeters, centerLat);
    
    const horizontalSpacing = Math.sqrt(3) * hexRadiusLng;
    const verticalSpacing = 1.5 * hexRadiusLat;
    const horizontalOffset = horizontalSpacing / 2;
    
    // Calcula a diferença em relação à origem
    const deltaLat = origin[0] - lat;
    const deltaLng = lng - origin[1];
    
    // Estima as coordenadas hexagonais
    // Usa floor/ceil para garantir que capture hexágonos nas bordas
    const r = Math.floor(deltaLat / verticalSpacing);
    const offsetX = (r % 2) * horizontalOffset;
    const q = Math.floor((deltaLng - offsetX) / horizontalSpacing);
    
    return { q, r };
  }
  /**
   * Gera hexágonos visíveis baseados nos bounds, mas com posições fixas
   * Os hexágonos sempre têm as mesmas posições no mundo real
   */
  static generateHexagonGrid(options: HexagonGridOptions): Hexagon[] {
    const { bounds } = options;
    const { hexSize } = this.fixedGridConfig;
    const hexagons: Hexagon[] = [];
    
    // Calcula o raio do hexágono em graus
    const centerLat = (bounds.north + bounds.south) / 2;
    const hexRadiusMeters = hexSize;
    const hexRadiusLat = this.metersToLatDegrees(hexRadiusMeters);
    const hexRadiusLng = this.metersToLngDegrees(hexRadiusMeters, centerLat);
    
    // Para tesselação perfeita (pointy-top)
    const horizontalSpacing = Math.sqrt(3) * hexRadiusLng;
    const verticalSpacing = 1.5 * hexRadiusLat;
    
    // Calcula o range de coordenadas hexagonais necessárias para cobrir os bounds
    // Usa múltiplos pontos para garantir cobertura completa
    const topLeftHex = this.latLngToHex(bounds.north, bounds.west);
    const bottomRightHex = this.latLngToHex(bounds.south, bounds.east);
    const topRightHex = this.latLngToHex(bounds.north, bounds.east);
    const bottomLeftHex = this.latLngToHex(bounds.south, bounds.west);
    const centerHex = this.latLngToHex((bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2);
    
    // Encontra os limites reais considerando todos os pontos
    const allQs = [topLeftHex.q, bottomRightHex.q, topRightHex.q, bottomLeftHex.q, centerHex.q];
    const allRs = [topLeftHex.r, bottomRightHex.r, topRightHex.r, bottomLeftHex.r, centerHex.r];
    
    const minQ = Math.min(...allQs) - 5; // Margem maior para zoom distante
    const maxQ = Math.max(...allQs) + 5;
    const minR = Math.min(...allRs) - 5;
    const maxR = Math.max(...allRs) + 5;
    
    // Gera hexágonos com coordenadas fixas
    // Remove a verificação de interseção para garantir que todos os hexágonos no range sejam gerados
    // A verificação de interseção pode estar muito restritiva em zooms distantes
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const center = this.hexToLatLng(q, r);
        
        // Verificação simplificada: apenas verifica se o centro está próximo dos bounds
        // Isso garante que hexágonos sejam gerados mesmo em zooms distantes
        const centerLat = center[0];
        const centerLng = center[1];
        
        // Expande os bounds com uma margem generosa baseada no tamanho do hexágono
        const marginLat = hexRadiusLat * 2;
        const marginLng = hexRadiusLng * 2;
        
        const isVisible = 
          centerLat >= bounds.south - marginLat &&
          centerLat <= bounds.north + marginLat &&
          centerLng >= bounds.west - marginLng &&
          centerLng <= bounds.east + marginLng;
        
        if (isVisible) {
          const coordinates = this.generateHexagonCoordinates(
            center,
            hexRadiusLat,
            hexRadiusLng
          );
          
          const id = this.getHexagonId(q, r);
          
          hexagons.push({
            id,
            center: center,
            coordinates,
            occurrenceCount: 0,
            intensity: 0
          });
        }
      }
    }
    
    return hexagons;
  }

  /**
   * Gera as 6 coordenadas de um hexágono perfeitamente orientado (pointy-top)
   * Com a ponta apontando para cima
   */
  private static generateHexagonCoordinates(
    center: [number, number],
    radiusLat: number,
    radiusLng: number
  ): [number, number][] {
    const coordinates: [number, number][] = [];
    const [centerLat, centerLng] = center;
    
    // Gera 6 vértices do hexágono (orientação pointy-top)
    // Rotaciona 30 graus (π/6) para que a ponta fique para cima
    // Começa do topo e vai no sentido horário
    const rotationOffset = Math.PI / 6; // 30 graus de rotação
    
    for (let i = 0; i < 6; i++) {
      // Ângulo base: cada vértice está a 60° (π/3) do anterior
      // Começa em -90° e rotaciona 30° para ter ponta no topo
      const angle = (Math.PI / 3) * i - (Math.PI / 2) + rotationOffset;
      const lat = centerLat + radiusLat * Math.cos(angle);
      const lng = centerLng + radiusLng * Math.sin(angle);
      coordinates.push([lat, lng]);
    }
    
    // Fecha o polígono (último ponto = primeiro ponto)
    coordinates.push(coordinates[0]);
    
    return coordinates;
  }

  /**
   * Converte metros para graus de latitude
   */
  private static metersToLatDegrees(meters: number): number {
    // 1 grau de latitude ≈ 111 km
    return meters / 111000;
  }

  /**
   * Converte metros para graus de longitude
   */
  private static metersToLngDegrees(meters: number, latitude: number): number {
    // 1 grau de longitude ≈ 111 km * cos(latitude)
    return meters / (111000 * Math.cos(latitude * Math.PI / 180));
  }

  /**
   * Verifica se um hexágono intersecta com os bounds
   * Versão mais permissiva para garantir que hexágonos apareçam em todos os zooms
   */
  private static hexagonIntersectsBounds(
    center: [number, number],
    radiusLat: number,
    radiusLng: number,
    bounds: { north: number; south: number; east: number; west: number }
  ): boolean {
    const [centerLat, centerLng] = center;
    
    // Verifica se o hexágono está dentro ou intersecta os bounds
    // Usa um bounding box expandido para garantir que hexágonos próximos sejam incluídos
    const hexMinLat = centerLat - radiusLat * 1.5;
    const hexMaxLat = centerLat + radiusLat * 1.5;
    const hexMinLng = centerLng - radiusLng * 1.5;
    const hexMaxLng = centerLng + radiusLng * 1.5;
    
    return !(
      hexMaxLat < bounds.south ||
      hexMinLat > bounds.north ||
      hexMaxLng < bounds.west ||
      hexMinLng > bounds.east
    );
  }

  /**
   * Encontra o hexágono que contém um ponto usando coordenadas fixas
   */
  static findHexagonContainingPoint(
    point: [number, number],
    hexagons?: Hexagon[]
  ): Hexagon | null {
    // Se hexagons for fornecido, usa busca direta (mais rápido para muitos hexágonos)
    if (hexagons && hexagons.length > 0) {
      for (const hex of hexagons) {
        if (this.isPointInHexagon(point, hex)) {
          return hex;
        }
      }
    }
    
    // Caso contrário, calcula diretamente usando coordenadas hexagonais fixas
    const hexCoords = this.latLngToHex(point[0], point[1]);
    const id = this.getHexagonId(hexCoords.q, hexCoords.r);
    const center = this.hexToLatLng(hexCoords.q, hexCoords.r);
    
    // Calcula distância aproximada em graus e verifica se está dentro do raio
    const hexRadiusMeters = this.fixedGridConfig.hexSize;
    const centerLat = point[0];
    const hexRadiusLat = this.metersToLatDegrees(hexRadiusMeters);
    const hexRadiusLng = this.metersToLngDegrees(hexRadiusMeters, centerLat);
    
    // Verifica se o ponto está dentro do hexágono usando distância aproximada
    const deltaLat = Math.abs(point[0] - center[0]);
    const deltaLng = Math.abs(point[1] - center[1]);
    
    // Se está dentro do bounding box do hexágono, considera válido
    // (verificação mais simples e rápida)
    if (deltaLat <= hexRadiusLat * 1.2 && deltaLng <= hexRadiusLng * 1.2) {
      const coordinates = this.generateHexagonCoordinates(center, hexRadiusLat, hexRadiusLng);
      
      const hex: Hexagon = {
        id,
        center,
        coordinates,
        occurrenceCount: 0,
        intensity: 0
      };
      
      // Verifica usando o algoritmo de ray casting
      if (this.isPointInHexagon(point, hex)) {
        return hex;
      }
    }
    
    return null;
  }

  /**
   * Verifica se um ponto está dentro de um hexágono
   * Usa algoritmo ray casting corrigido para coordenadas geográficas
   */
  private static isPointInHexagon(
    point: [number, number],
    hexagon: Hexagon
  ): boolean {
    // Algoritmo ray casting
    // Coordenadas: [lat, lng] onde lat = Y, lng = X
    let inside = false;
    const [pointLat, pointLng] = point;
    const coords = hexagon.coordinates;
    
    // Remove o último ponto duplicado se existir
    const cleanCoords = coords.length > 0 && 
      coords[0][0] === coords[coords.length - 1][0] && 
      coords[0][1] === coords[coords.length - 1][1]
      ? coords.slice(0, -1)
      : coords;
    
    for (let i = 0, j = cleanCoords.length - 1; i < cleanCoords.length; j = i++) {
      const [latI, lngI] = cleanCoords[i];
      const [latJ, lngJ] = cleanCoords[j];
      
      // Ray casting: verifica se o raio horizontal cruza a aresta
      const intersect =
        ((lngI > pointLng) !== (lngJ > pointLng)) &&
        (pointLat < ((latJ - latI) * (pointLng - lngI)) / (lngJ - lngI) + latI);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * Calcula a intensidade baseada na contagem de ocorrências
   */
  static calculateIntensity(
    occurrenceCount: number,
    maxOccurrences: number
  ): number {
    if (maxOccurrences === 0) return 0;
    return Math.min(occurrenceCount / maxOccurrences, 1);
  }

  /**
   * Gera cor baseada na quantidade absoluta de ocorrências
   * Escala: Amarelo claro (poucas) -> Amarelo -> Laranja -> Vermelho (muitas)
   */
  static getColorByOccurrenceCount(count: number): string {
    if (count === 0) {
      return 'transparent'; // Transparente para sem ocorrências
    }
    
    // Escala baseada em quantidade absoluta de ocorrências
    // 1-3: Amarelo muito claro
    // 4-7: Amarelo claro
    // 8-12: Amarelo
    // 13-20: Amarelo para laranja claro
    // 21-30: Laranja
    // 31-50: Laranja escuro
    // 51+: Vermelho
    
    if (count <= 3) {
      // Amarelo muito claro (1-3 ocorrências)
      const factor = count / 3;
      return this.interpolateColor('#FFF9C4', '#FFEB3B', factor);
    } else if (count <= 7) {
      // Amarelo claro para amarelo (4-7 ocorrências)
      const factor = (count - 3) / 4;
      return this.interpolateColor('#FFEB3B', '#FFC107', factor);
    } else if (count <= 12) {
      // Amarelo para amarelo intenso (8-12 ocorrências)
      const factor = (count - 7) / 5;
      return this.interpolateColor('#FFC107', '#FFA726', factor);
    } else if (count <= 20) {
      // Amarelo intenso para laranja claro (13-20 ocorrências)
      const factor = (count - 12) / 8;
      return this.interpolateColor('#FFA726', '#FF9800', factor);
    } else if (count <= 30) {
      // Laranja claro para laranja (21-30 ocorrências)
      const factor = (count - 20) / 10;
      return this.interpolateColor('#FF9800', '#FF6F00', factor);
    } else if (count <= 50) {
      // Laranja para laranja escuro (31-50 ocorrências)
      const factor = (count - 30) / 20;
      return this.interpolateColor('#FF6F00', '#FF5722', factor);
    } else {
      // Laranja escuro para vermelho (51+ ocorrências)
      // Limita a 100 ocorrências para o cálculo do factor
      const factor = Math.min((count - 50) / 50, 1);
      return this.interpolateColor('#FF5722', '#F44336', factor);
    }
  }

  /**
   * Calcula a opacidade baseada na quantidade de ocorrências
   * Retorna opacidade menor para quantidades baixas (amarelo com opacidade)
   */
  static getOpacityByOccurrenceCount(count: number): number {
    if (count === 0) {
      return 0.05; // Muito transparente para sem ocorrências
    }
    
    // Para quantidades muito baixas, usar opacidade reduzida
    if (count <= 2) {
      // Opacidade de 0.3 a 0.4 para 1-2 ocorrências
      return 0.3 + ((count - 1) / 1) * 0.1;
    } else if (count <= 5) {
      // Opacidade de 0.4 a 0.55 para 3-5 ocorrências
      return 0.4 + ((count - 2) / 3) * 0.15;
    } else if (count <= 10) {
      // Opacidade de 0.55 a 0.65 para 6-10 ocorrências
      return 0.55 + ((count - 5) / 5) * 0.1;
    } else {
      // Opacidade completa para 11+ ocorrências
      return 0.7;
    }
  }

  /**
   * Interpola entre duas cores hexadecimais
   */
  private static interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Converte cor hexadecimal para RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  /**
   * Calcula o tamanho ideal do hexágono baseado no zoom
   */
  static getHexSizeForZoom(zoom: number): number {
    // Tamanho em metros baseado no zoom
    // Zoom 10: ~500m, Zoom 13: ~200m, Zoom 15: ~100m
    if (zoom <= 10) return 500;
    if (zoom <= 12) return 300;
    if (zoom <= 14) return 200;
    if (zoom <= 16) return 100;
    return 50; // Zoom muito alto
  }
}
