from deplio.models.data import latest
from deplio.models.versions import version_bundle
from cadwyn import generate_code_for_versioned_packages

if __name__ == '__main__':
    generate_code_for_versioned_packages(latest, version_bundle)
