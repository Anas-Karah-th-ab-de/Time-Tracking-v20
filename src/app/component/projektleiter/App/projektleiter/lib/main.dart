import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert'; // Für JSON-Operationen

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Projektdetails'),
        ),
        body: const ProjectDetailsPage(),
      ),
    );
  }
}

class ProjectDetailsPage extends StatefulWidget {
  const ProjectDetailsPage({Key? key}) : super(key: key);

  @override
  State<ProjectDetailsPage> createState() => _ProjectDetailsPageState();
}

class _ProjectDetailsPageState extends State<ProjectDetailsPage> {
  bool editMode = false;

  @override
  Widget build(BuildContext context) {
    // Simulierte Daten für die Demonstration
    final Map<String, dynamic> vollePaletten = {
      'Paletten': 10,
      'Kartons': 200,
      'Stück pro Karton': 100,
      'Gesamtmenge': 2000,
    };
    
    final Map<String, dynamic> restPaletten = {
      'Paletten': 2,
      'Kartons': 40,
      'Stück pro Karton': 100,
      'Gesamtmenge': 400,
    };
    
    final Map<String, dynamic> gesamtDaten = {
      'Liefermenge': 2400,
      'Muster Kunde': 5,
      'Muster PP': 3,
      'Gesamtmenge': 2392,
    };

    return SingleChildScrollView(
      child: Column(
        children: [
          const Text('Letztes Projekt'),
          _buildDataSection('Volle Paletten', vollePaletten),
          _buildDataSection('Rest Paletten', restPaletten),
          _buildDataSection('Gesamtdaten', gesamtDaten),
          SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {
              setState(() {
                editMode = !editMode;
              });
            },
            child: Text(editMode ? 'Speichern' : 'Bearbeiten'),
          ),
        ],
      ),
    );
  }

  Widget _buildDataSection(String title, Map<String, dynamic> data) {
    return Card(
      margin: const EdgeInsets.all(10),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ...data.entries.map((entry) => Text('${entry.key}: ${entry.value}')).toList(),
          ],
        ),
      ),
    );
  }
}
@override
Widget build(BuildContext context) {
  return SingleChildScrollView(
    child: Column(
      children: [
        const Text('Projekte'),
        FutureBuilder<List<dynamic>>(
          future: fetchProjects('IhrAuftrag'), // Ihr Auftrag als Parameter
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              List<dynamic> projects = snapshot.data!;
              return ListView.builder(
                shrinkWrap: true,
                itemCount: projects.length,
                itemBuilder: (context, index) {
                  return ListTile(
                    title: Text(projects[index]['name']), // Angenommen, jedes Projekt hat einen Namen
                    onTap: () {
                      // Logik, um das ausgewählte Projekt zur Bearbeitung zu wählen
                    },
                  );
                },
              );
            } else if (snapshot.hasError) {
              return Text("${snapshot.error}");
            }
            // Standardmäßig zeigen wir einen Ladekreis an.
            return CircularProgressIndicator();
          },
        ),
        // Weitere Widgets hier
      ],
    ),
  );
}
Future<List<dynamic>> fetchProjects(String auftrag) async {
  final response = await http.get(Uri.parse('http://kmapp.prestigepromotion.de:3002/projekte?auftrag=$auftrag'));

  if (response.statusCode == 200) {
    // Wenn der Server ein 200 OK Antwort zurückgibt, parsen wir den JSON
    return json.decode(response.body);
  } else {
    // Wenn der Server keine 200 OK Antwort zurückgibt, werfen wir einen Fehler
    throw Exception('Failed to load projects');
  }
}
