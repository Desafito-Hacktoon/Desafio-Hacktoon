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
    const r = Math.round(deltaLat / verticalSpacing);
    const offsetX = (r % 2) * horizontalOffset;
    const q = Math.round((deltaLng - offsetX) / horizontalSpacing);
    
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
    const topLeftHex = this.latLngToHex(bounds.north, bounds.west);
    const bottomRightHex = this.latLngToHex(bounds.south, bounds.east);
    
    // Adiciona margem para garantir cobertura completa
    const minQ = topLeftHex.q - 2;
    const maxQ = bottomRightHex.q + 2;
    const minR = bottomRightHex.r - 2;
    const maxR = topLeftHex.r + 2;
    
    // Gera hexágonos com coordenadas fixas
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const center = this.hexToLatLng(q, r);
        
        // Verifica se o hexágono intersecta com os bounds visíveis
        if (this.hexagonIntersectsBounds(center, hexRadiusLat, hexRadiusLng, bounds)) {
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
   */
  private static hexagonIntersectsBounds(
    center: [number, number],
    radiusLat: number,
    radiusLng: number,
    bounds: { north: number; south: number; east: number; west: number }
  ): boolean {
    const [centerLat, centerLng] = center;
    
    // Verifica se o hexágono está dentro ou intersecta os bounds
    // Um hexágono intersecta se seu bounding box intersecta
    const hexMinLat = centerLat - radiusLat;
    const hexMaxLat = centerLat + radiusLat;
    const hexMinLng = centerLng - radiusLng;
    const hexMaxLng = centerLng + radiusLng;
    
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
   * Gera cor baseada na intensidade (escala de laranja/amarelo como Uber/99)
   */
  static getColorByIntensity(intensity: number): string {
    if (intensity === 0) {
      return 'transparent'; // Transparente para sem ocorrências
    }
    
    // Escala de cores similar ao Uber/99: Amarelo claro -> Laranja -> Vermelho
    if (intensity < 0.33) {
      // Amarelo claro para amarelo
      const factor = intensity / 0.33;
      return this.interpolateColor('#FFF9C4', '#FFD700', factor);
    } else if (intensity < 0.66) {
      // Amarelo para laranja
      const factor = (intensity - 0.33) / 0.33;
      return this.interpolateColor('#FFD700', '#FF8C00', factor);
    } else {
      // Laranja para vermelho
      const factor = (intensity - 0.66) / 0.34;
      return this.interpolateColor('#FF8C00', '#FF4500', factor);
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
