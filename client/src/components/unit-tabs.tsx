import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Assignment, Note, PastPaper } from "@shared/schema";
import AssignmentForm from "./AssignmentForm";
import NoteForm from "./NoteForm";
import PastPaperForm from "./PastPaperForm";
import AssignmentCard from "./AssignmentCard";
import NoteCard from "./NoteCard";
import PastPaperCard from "./PastPaperCard";
import RankingTable from "./RankingTable";
import { AlertCircle, Check, FileText, BarChart, Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type UnitTabsProps = {
  unitCode: string;
};

export default function UnitTabs({ unitCode }: UnitTabsProps) {
  // State for modal visibility
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  const [isPastPapersModalOpen, setIsPastPapersModalOpen] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTab, setCurrentTab] = useState("notes");
  const [searchResults, setSearchResults] = useState<{
    notes: Note[] | null;
    assignments: Assignment[] | null;
    pastPapers: PastPaper[] | null;
  }>({ notes: null, assignments: null, pastPapers: null });
  const [isSearching, setIsSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Fetch content for the tabs
  const { data: notes, isLoading: isLoadingNotes } = useQuery<Note[]>({
    queryKey: [`/api/units/${unitCode}/notes`],
  });

  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<Assignment[]>({
    queryKey: [`/api/units/${unitCode}/assignments`],
  });

  const { data: pastPapers, isLoading: isLoadingPastPapers } = useQuery<PastPaper[]>({
    queryKey: [`/api/units/${unitCode}/pastpapers`],
  });

  // Filtered data based on search
  const filteredNotes = notes?.filter(note => 
    searchQuery === "" || 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = assignments?.filter(assignment => 
    searchQuery === "" || 
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastPapers = pastPapers?.filter(paper => 
    searchQuery === "" || 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.year.toString().includes(searchQuery)
  );

  // Count notifications
  const unreadNotes = notes?.filter(note => !note.viewed).length || 0;
  const pendingAssignments = assignments?.filter(assignment => !assignment.completed).length || 0;
  const unreadPastPapers = pastPapers?.filter(paper => !paper.viewed).length || 0;

  // Create mutations for marking as viewed/completed
  const markNoteViewed = useMutation({
    mutationFn: async (noteId: number) => {
      await fetch(`/api/units/${unitCode}/notes/${noteId}/view`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
    },
  });

  const markPaperViewed = useMutation({
    mutationFn: async (paperId: number) => {
      await fetch(`/api/units/${unitCode}/pastpapers/${paperId}/view`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitCode}/pastpapers`] });
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
    },
  });

  // Effects for search functionality
  useEffect(() => {
    // Perform search across all content types when query changes
    if (searchQuery.length > 1) {
      setIsSearching(true);
      
      // Update search results
      setSearchResults({
        notes: notes?.filter(note => 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
        ) || null,
        assignments: assignments?.filter(assignment => 
          assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
        ) || null,
        pastPapers: pastPapers?.filter(paper => 
          paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
          paper.year.toString().includes(searchQuery)
        ) || null
      });
      
      setIsSearching(false);
    } else if (searchQuery === "") {
      // Reset search results when query is cleared
      setSearchResults({ notes: null, assignments: null, pastPapers: null });
    }
  }, [searchQuery, notes, assignments, pastPapers]);

  // Track tab changes
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setSearchQuery("");
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
      <Tabs defaultValue="notes" onValueChange={handleTabChange}>
        <div className="overflow-x-auto pb-2 mb-2">
          <TabsList className="mb-2 inline-flex min-w-max">
            <TabsTrigger value="notes" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notes</span>
              {unreadNotes > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {unreadNotes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>Assignments</span>
              {pendingAssignments > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {pendingAssignments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pastpapers" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Past Papers</span>
              {unreadPastPapers > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-500 text-white">
                  {unreadPastPapers}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rank" className="flex items-center space-x-2">
              <BarChart className="h-4 w-4" />
              <span>Rank</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Search bar for all except rankings */}
        {currentTab !== "rank" && (
          <div className="relative mb-4">
            <div className={`flex items-center bg-gray-50 border rounded-md ${searchFocused ? 'ring-2 ring-primary shadow-sm' : ''} transition-all`}>
              <Search className="ml-3 h-4 w-4 shrink-0 text-gray-500" />
              <Input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={`Search ${currentTab}...`}
                className="flex w-full rounded-md border-0 bg-transparent py-2 text-sm focus:outline-none focus:ring-0 focus-visible:ring-0"
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  onClick={clearSearch} 
                  className="h-auto px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Animated search results count */}
            {searchQuery && (
              <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                <span className={`inline-block rounded-full w-2 h-2 ${
                  isSearching ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
                }`}></span>
                {currentTab === "notes" && (
                  <span>{filteredNotes?.length || 0} note{filteredNotes?.length !== 1 ? "s" : ""} found</span>
                )}
                {currentTab === "assignments" && (
                  <span>{filteredAssignments?.length || 0} assignment{filteredAssignments?.length !== 1 ? "s" : ""} found</span>
                )}
                {currentTab === "pastpapers" && (
                  <span>{filteredPastPapers?.length || 0} past paper{filteredPastPapers?.length !== 1 ? "s" : ""} found</span>
                )}
              </div>
            )}
          </div>
        )}

        <TabsContent value="notes">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Course Notes</h2>
              <p className="text-sm text-gray-600">Lecture notes, supplementary materials and study guides</p>
            </div>
            
            <Button
              onClick={() => setIsNotesModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Notes
            </Button>
          </div>
          
          {isLoadingNotes ? (
            <div className="text-center py-10">Loading notes...</div>
          ) : notes?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No notes available yet</p>
            </div>
          ) : filteredNotes?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No matching notes found</p>
              <Button variant="link" onClick={clearSearch} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes?.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onView={() => markNoteViewed.mutate(note.id)}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Assignments</h2>
              <p className="text-sm text-gray-600">Homework, projects and other assessments</p>
            </div>
            
            <Button
              onClick={() => setIsAssignmentsModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <Check className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </div>
          
          {isLoadingAssignments ? (
            <div className="text-center py-10">Loading assignments...</div>
          ) : assignments?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No assignments available yet</p>
            </div>
          ) : filteredAssignments?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No matching assignments found</p>
              <Button variant="link" onClick={clearSearch} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments?.map(assignment => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pastpapers">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Past Papers</h2>
              <p className="text-sm text-gray-600">Previous exams, quizzes and assessment papers</p>
            </div>
            
            <Button
              onClick={() => setIsPastPapersModalOpen(true)}
              className={`${
                unitCode.startsWith("MAT") ? "bg-blue-500 hover:bg-blue-600" : 
                unitCode.startsWith("STA") ? "bg-green-500 hover:bg-green-600" : 
                unitCode.startsWith("DAT") ? "bg-purple-500 hover:bg-purple-600" : 
                "bg-amber-500 hover:bg-amber-600"
              } text-white`}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Past Paper
            </Button>
          </div>
          
          {isLoadingPastPapers ? (
            <div className="text-center py-10">Loading past papers...</div>
          ) : pastPapers?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No past papers available yet</p>
            </div>
          ) : filteredPastPapers?.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No matching past papers found</p>
              <Button variant="link" onClick={clearSearch} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPastPapers?.map(paper => (
                <PastPaperCard
                  key={paper.id}
                  pastPaper={paper}
                  onView={() => markPaperViewed.mutate(paper.id)}
                  unitCode={unitCode}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rank">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Assignment Rankings</h2>
            <p className="text-sm text-gray-600">Student performance based on assignment completion times</p>
          </div>
          
          <RankingTable unitCode={unitCode} />
        </TabsContent>
      </Tabs>

      {/* Modals for forms */}
      <NoteForm 
        unitCode={unitCode}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)} 
      />
      
      <AssignmentForm 
        unitCode={unitCode}
        isOpen={isAssignmentsModalOpen}
        onClose={() => setIsAssignmentsModalOpen(false)}
      />
      
      <PastPaperForm 
        unitCode={unitCode}
        isOpen={isPastPapersModalOpen}
        onClose={() => setIsPastPapersModalOpen(false)}
      />
    </>
  );
}
