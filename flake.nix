{
  description = "Dev shell Node 22 + nodemon";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }: 
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in {
      devShells = forAllSystems (system: {
        default = let
          pkgs = import nixpkgs { inherit system; };
        in pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_22
            nodePackages_latest.nodemon
            nodePackages_latest.pm2
            
            # Container & deployment tools
            docker
            docker-compose
            
            # Development utilities
            curl
            jq
          ];
        };
      });
    };
}